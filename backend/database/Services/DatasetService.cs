using database.Models;
using database.Settings;
using MongoDB.Bson;
using MongoDB.Driver;
using MongoDB.Driver.GridFS;
using System;
using System.Collections.Generic;
using System.IO;
using System.Text;

namespace database.Services {
    public class DatasetService {

        private readonly IMongoCollection<Dataset> _datasets;
        private readonly IGridFSBucket _datasetsBucket;

        public DatasetService(IMongoDBSettings settings) {
            MongoClient client = new MongoClient(settings.ConnectionString);
            IMongoDatabase db = client.GetDatabase(settings.DatabaseName);

            _datasets = db.GetCollection<Dataset>(settings.DatasetstoreBucket.CollectionName);

            _datasetsBucket = new GridFSBucket(db, new GridFSBucketOptions {
                BucketName = settings.DatasetstoreBucket.BucketName,
                ChunkSizeBytes = settings.DatasetstoreBucket.ChunkSizeBytes,
                WriteConcern = settings.DatasetstoreBucket.WConcern,
                ReadPreference = settings.DatasetstoreBucket.RPreference
            });
        }

        // Collection methods

        public Dataset Get(string id) {
            return _datasets.Find(d => d.Id == id).FirstOrDefault();
        }

        public List<Dataset> GetAll() {
            return _datasets.Find(d => d.Shown).ToList();
        }

        public Dataset Create(Dataset dataset) {
            _datasets.InsertOne(dataset);

            return dataset;
        }

        public Dataset Update(string id, Dataset dataset) {
            dataset.Id = id;
            _datasets.ReplaceOne(d => d.Id == id, dataset);

            return dataset;
        }

        public Dataset Rename(string id, string name) {
            Dataset dataset = _datasets.Find(d => d.Id == id).FirstOrDefault();
            dataset.Name = name;
            _datasets.ReplaceOne(d => d.Id == id, dataset);

            return dataset;
        }

        public Dataset ChangeResolution(string id, double resolution) {
            Dataset dataset = _datasets.Find(d => d.Id == id).FirstOrDefault();
            dataset.Resolution = resolution;
            _datasets.ReplaceOne(d => d.Id == id, dataset);

            return dataset;
        }

        public void Remove(Dataset dataset) {
            _datasets.DeleteOne(d => d.Id == dataset.Id);
        }

        public void Remove(string id) {
            _datasets.DeleteOne(d => d.Id == id);
        }

        // Bucket methods

        public GridFSFileInfo Upload(byte[] source, string filename) {
            ObjectId id = _datasetsBucket.UploadFromBytes(filename, source);

            FilterDefinition<GridFSFileInfo> filter = Builders<GridFSFileInfo>.Filter.Eq(o => o.Id, id);
            return _datasetsBucket.Find(filter).FirstOrDefault();
        }

        public GridFSFileInfo Upload(Stream stream, string filename) {
            ObjectId id = _datasetsBucket.UploadFromStream(filename, stream);

            FilterDefinition<GridFSFileInfo> filter = Builders<GridFSFileInfo>.Filter.Eq("_id", id);
            return _datasetsBucket.Find(filter).FirstOrDefault();
        }

        public byte[] Download(string id) {
            ObjectId objectId = new ObjectId(id);
            return _datasetsBucket.DownloadAsBytes(objectId);
        }

        public void RemoveDatafile(string id) {
            ObjectId objectId = new ObjectId(id);
            _datasetsBucket.Delete(objectId);
        }
    }
}
