using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace backend.Settings {
    public interface IPythonBackendSettings {
        string Url { get; set; }
        PythonBackendRoutes Routes { get; set; }
    }
}
