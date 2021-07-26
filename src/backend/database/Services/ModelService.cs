using database.Models;
using database.Models.Derived;
using database.Settings;
using MongoDB.Driver;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Text;
using System.Text.Json.Serialization;

namespace database.Services {
    public class ModelService {
        private readonly IMongoCollection<Model> _models;
        private readonly DatasetService _datasetService;

        public ModelService(IMongoDBSettings settings, DatasetService datasetService) {
            MongoClient client = new MongoClient(settings.ConnectionString);
            IMongoDatabase db = client.GetDatabase(settings.DatabaseName);

            _models = db.GetCollection<Model>(settings.ModelstoreDb.CollectionName);
            _datasetService = datasetService;
        }

        public List<Model> GetAll() {
            return _models.Find(m => true).ToList();
        }

        public Model Get(string id) {
            return _models.Find(m => m.Id == id).FirstOrDefault();
        }

        public List<ModelLimited> GetQueuedModels(int howMany) {
            List<ModelLimited> result = new List<ModelLimited>();

            Model runningModel = _models.Find(m => m.Status == Enums.Status.RUNNING).FirstOrDefault();
            if (runningModel != null) {
                ModelLimited modelLimited = new ModelLimited(runningModel);
                modelLimited.DatasetName = _datasetService.Get(modelLimited.DatasetID).Name;
                modelLimited.PositionInQueue = 0;
                result.Add(modelLimited);
            }

            int index = 1;
            _models.Find(m => m.Status == Enums.Status.QUEUED)
                .SortBy(m => m.Queued)
                .Limit(howMany).ToList().ForEach(m => {
                    ModelLimited modelLimited = new ModelLimited(m);
                    modelLimited.DatasetName = _datasetService.Get(m.DatasetID).Name;
                    modelLimited.PositionInQueue = index;
                    result.Add(modelLimited);

                    index += 1;
                });

            return result;
        }

        public List<ModelLimited> GetRecentFinishedModels(int howMany) {
            List<ModelLimited> result = new List<ModelLimited>();

            int index = 0;
            _models.Find(m => m.Status == Enums.Status.FINISHED)
                .SortByDescending(m => m.Started)
                .Limit(howMany).ToList().ForEach(m => {
                    ModelLimited modelLimited = new ModelLimited(m);
                    modelLimited.DatasetName = _datasetService.Get(m.DatasetID).Name;
                    modelLimited.PositionInQueue = index;
                    result.Add(modelLimited);

                    index += 1;
                });

            return result;
        }

        public long GetModelsInQueue() {
            return _models.CountDocuments(m => (m.Status == Enums.Status.QUEUED || m.Status == Enums.Status.RUNNING));
        }

        public FilterParameters GetFilterParameters() {

            List<string> datasetIds = _models.Distinct<string>("DatasetID", FilterDefinition<Model>.Empty).ToList();
            List<string> architectures = _models.Distinct<string>("ModelType", FilterDefinition<Model>.Empty).ToList();

            List<string> datasetNames = new List<string>();
            foreach (string datasetId in datasetIds) {
                Dataset dataset = _datasetService.Get(datasetId);

                if (dataset == null) datasetNames.Add("UNKNOWN");
                else datasetNames.Add(dataset.Name);
            }

            return new FilterParameters {
                DatasetsIds = datasetIds,
                DatasetNames = datasetNames,
                Architectures = architectures,
            };
        }

        public FilteredSearchResult GetFilteredModels(int howMany, int page=0, string datasetId=null, string modelType=null, string sort=null, string versionSearch=null) {
            var filterBuilder = new FilterDefinitionBuilder<Model>();
            List<FilterDefinition<Model>> filters = new List<FilterDefinition<Model>>();
            var filter = filterBuilder.Empty;

            filters.Add(new ExpressionFilterDefinition<Model>(m => m.Status == Enums.Status.FINISHED));
            if (datasetId != null) filters.Add(new ExpressionFilterDefinition<Model>(m => m.DatasetID == datasetId));
            if (modelType != null) filters.Add(new ExpressionFilterDefinition<Model>(m => m.ModelType == modelType));
            if (versionSearch != null && versionSearch.Length > 0) {
                if (versionSearch.StartsWith("v")) versionSearch = versionSearch.Substring(1);
                string[] parts = versionSearch.Split(".");
                bool isValidVersion = int.TryParse(parts[0], out int version);

                if (isValidVersion) {
                    filters.Add(new ExpressionFilterDefinition<Model>(m => m.Version == version));
                }

                if (parts.Length > 1) {
                    bool isValidSubVersion = int.TryParse(parts[1], out int subVersion);
                    if (isValidSubVersion) {
                        filters.Add(new ExpressionFilterDefinition<Model>(m => m.SubVersion == subVersion));
                    }
                }
            }

            if (filters.Count > 0) {
                filter = filterBuilder.And(filters);
            }

            var result = _models.Find(filter);
            long totalResults = result.CountDocuments();
            long totalPages = (long) Math.Ceiling((double)totalResults / howMany);

            if (sort == "finished_descending") result = result.SortByDescending(m => m.Finished);
            else if (sort == "finished_ascending") result = result.SortBy(m => m.Finished);
            // todo: add overall accuracy & average accuracy

            List<Model> models = new List<Model>();
            if (page < totalPages) {
                result.Skip(page * howMany);
                result.Limit(howMany);
                models = result.ToList();
            }

            List<ModelLimited> returnedModels = new List<ModelLimited>();
            foreach (Model model in models) {
                ModelLimited modelLimited = new ModelLimited(model);
                Dataset dataset = _datasetService.Get(model.DatasetID);
                modelLimited.DatasetName = dataset.Name;
                returnedModels.Add(modelLimited);
            }

            return new FilteredSearchResult {
                ResultsPerPage = howMany,
                CurrentPage = page,
                TotalResults = totalResults,
                TotalPages = totalPages,
                Models = returnedModels
            };
        }

        public int GetAvailableModelVersion() {
            Model model = _models.Find(m => true).SortByDescending(m => m.Version).Limit(1).FirstOrDefault();
            if (model == null) return 1;

            return model.Version + 1;
        }

        public int GetAvailableModelSubVersion(int version) {
            Model model = _models.Find(m => m.Version == version).SortByDescending(m => m.SubVersion).Limit(1).FirstOrDefault();
            if (model == null) return 1;

            return model.SubVersion + 1;
        }

        public Model Create(Model model) {
            _models.InsertOne(model);
            return model;
        }

        public Model Update(string id, Model model) {
            model.Id = id;
            _models.ReplaceOne(m => m.Id == id, model);

            return model;
        }

        public void Remove(Model model) {
            _models.DeleteOne(m => m.Id == model.Id);
        }

        public void Remove(string id) {
            _models.DeleteOne(m => m.Id == id);
        }
    }

    public class FilteredSearchResult {
        [JsonProperty("results_per_page")]
        [JsonPropertyName("results_per_page")]
        public int ResultsPerPage { get; set; }

        [JsonProperty("current_page")]
        [JsonPropertyName("current_page")]
        public int CurrentPage { get; set; }

        [JsonProperty("total_pages")]
        [JsonPropertyName("total_pages")]
        public long TotalPages { get; set; }

        [JsonProperty("total_results")]
        [JsonPropertyName("total_results")]
        public long TotalResults { get; set; }

        public List<ModelLimited> Models { get; set; }
    }

    public class FilterParameters {

        [JsonProperty("dataset_ids")]
        [JsonPropertyName("dataset_ids")]
        public List<string> DatasetsIds { get; set; }

        [JsonProperty("dataset_names")]
        [JsonPropertyName("dataset_names")]
        public List<string> DatasetNames { get; set; }

        public List<string> Architectures { get; set; }
    }
}
