using System;
using System.Collections.Generic;
using System.Text;

namespace database.Settings {
    public interface IMongoDBSettings {
        string DatabaseName { get; set; }
        string ConnectionString { get; set; }

        AccountstoreDatabaseSettings AccountstoreDb { get; set; }
        DatasetstoreDatabaseSettings DatasetstoreBucket { get; set; }
        MatlabDatasetstoreDatabaseSettings DatatsetMatlabstoreDb { get; set; }
        ModelstoreDatabaseSettings ModelstoreDb { get; set; }
    }
}
