using System;
using System.Collections.Generic;
using System.Text;

namespace database.Settings {
    public class MongoDBSettings : IMongoDBSettings {
        public string DatabaseName { get; set; }
        public string ConnectionString { get; set; }
        public AccountstoreDatabaseSettings AccountstoreDb { get; set; }
        public DatasetstoreDatabaseSettings DatasetstoreBucket { get; set; }
        public MatlabDatasetstoreDatabaseSettings DatatsetMatlabstoreDb { get; set; }
        public ModelstoreDatabaseSettings ModelstoreDb { get; set; }
    }
}
