using MongoDB.Driver;
using System;
using System.Collections.Generic;
using System.Text;

namespace database.Settings {
    public class DatasetstoreDatabaseSettings {
        public string CollectionName { get; set; }

        public string BucketName { get; set; }

        public int ChunkSizeBytes { get; set; }

        public WriteConcern WConcern { get { return WriteConcern.WMajority; } }

        public ReadPreference RPreference { get { return ReadPreference.Secondary; } }
    }
}
