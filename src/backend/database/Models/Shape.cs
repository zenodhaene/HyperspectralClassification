using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace database.Models {
    public class Shape {
        [JsonProperty("class_id")]
        [JsonPropertyName("class_id")]
        public int ClassId { get; set; }

        public int X { get; set; }

        public int Y { get; set; }

        public int Width { get; set; }

        public int Height { get; set; }

        public double Rotation { get; set; }
    }
}
