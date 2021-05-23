using database.Models;
using database.Settings;
using Microsoft.Extensions.Logging;
using MongoDB.Driver;
using System;
using System.Collections.Generic;
using System.Text;

namespace database.Services {
    public class MatlabDatasetService {

        private readonly IMongoCollection<MatlabDataset> _matlabDatasets;
        private readonly ILogger _logger;

        public MatlabDatasetService(IMongoDBSettings settings) {
            MongoClient client = new MongoClient(settings.ConnectionString);
            IMongoDatabase db = client.GetDatabase(settings.DatabaseName);

            _matlabDatasets = db.GetCollection<MatlabDataset>(settings.DatatsetMatlabstoreDb.CollectionName);
        }

        public MatlabDataset Get(string id) {
            return _matlabDatasets.Find(m => m.Id == id).FirstOrDefault();
        }

        public MatlabDataset GetByDatasetId(string datasetId) {
            return _matlabDatasets.Find(m => m.Dataset == datasetId).FirstOrDefault();
        }

        public MatlabDataset Create(MatlabDataset mDataset) {
            long existingEntries = _matlabDatasets.CountDocuments(m => m.Dataset == mDataset.Dataset);

            if (existingEntries > 0) {
                _logger.LogError($"Tried to link matlab dataset to dataset but there was already a matlab object defined for that dataset. Dataset id: {mDataset.Dataset}");
                return null;
            }

            _matlabDatasets.InsertOne(mDataset);

            return mDataset;
        }

        public MatlabDataset CreateOrUpdate(MatlabDataset mDataset) {
            long existingEntries = _matlabDatasets.CountDocuments(m => m.Dataset == mDataset.Dataset);

            if (existingEntries == 0) return Create(mDataset);

            _matlabDatasets.ReplaceOne(m => m.Dataset == mDataset.Dataset, mDataset);

            return mDataset;
        }
    }
}
