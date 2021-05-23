using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace backend.Settings {
    public class PythonDataset {
        public string Base { get; set; }

        public string Validate { get; set; }

        public string ValidateGroundTruth { get; set; }

        public string Layer { get; set; }

        public string GenerateThumbnail { get; set; }

        public string GenerateGroundTruthImage { get; set; }

        public PythonDatasetMatlab Matlab { get; set; }

        public PythonDatasetEO1 EO1 { get; set; }
    }
}
