using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace backend.Dto {
    public class ValidateDatasetEO1Dto {
        [JsonProperty("success")]
        [JsonPropertyName("success")]
        public bool Success { get; set; } = true;

        [JsonProperty("error")]
        [JsonPropertyName("error")]
        public string Error { get; set; } = "";

        [JsonProperty("dimension")]
        [JsonPropertyName("dimension")]
        public int[] Dimension { get; set; } = { };

        [JsonProperty("n_spectral_bands")]
        [JsonPropertyName("n_spectral_bands")]
        public int? NSpectralBands { get; set; }
    }
}
