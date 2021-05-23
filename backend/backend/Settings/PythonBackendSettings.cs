using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace backend.Settings {
    public class PythonBackendSettings : IPythonBackendSettings {
        public string Url { get; set; }
        public PythonBackendRoutes Routes { get; set; }
    }
}
