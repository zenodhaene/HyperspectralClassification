using database.Enums;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Text;
using System.Text.Json.Serialization;

namespace database.Models {
    public class Dataset {
        [BsonId]
        [BsonRepresentation(MongoDB.Bson.BsonType.ObjectId)]
        public string Id { get; set; }

        [BsonRequired]
        [BsonRepresentation(MongoDB.Bson.BsonType.ObjectId)]
        public string File { get; set; }

        [BsonRequired]
        [BsonRepresentation(MongoDB.Bson.BsonType.Int32)]
        public DatafileType DatafileType { get; set; }

        [BsonRequired]
        public bool Shown { get; set; } = false;

        [BsonRequired]
        public string Name { get; set; }

        [BsonRequired]
        public int[] Dimension { get; set; } = null;

        [BsonRequired]
        [JsonProperty("n_spectral_bands")]
        [JsonPropertyName("n_spectral_bands")]
        public int? NSpectralBands { get; set; } = null;

        [BsonRequired]
        public string Thumbnail { get; set; } = null;

        [BsonRequired]
        // in m^2, -1 -> resolution in pixels
        public double Resolution { get; set; } = -1;

        [BsonRequired]
        [BsonRepresentation(MongoDB.Bson.BsonType.ObjectId)]
        [JsonProperty("ground_truth")]
        [JsonPropertyName("ground_truth")]
        public string GroundTruth { get; set; }

        [BsonRequired]
        public bool Valid { get; set; } = false;

        [BsonRequired]
        public DateTime Uploaded = DateTime.Now;
    }
}
