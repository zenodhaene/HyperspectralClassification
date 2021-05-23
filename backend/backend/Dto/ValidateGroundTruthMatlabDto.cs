using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace backend.Dto {
    public class ValidateGroundTruthMatlabDto {
        public bool Success { get; set; }

        public bool Valid { get; set; }

        public string Message { get; set; } = "";
    }
}
