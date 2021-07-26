using database.Enums;
using MongoDB.Bson.Serialization.Attributes;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Text;
using System.Text.Json.Serialization;

namespace database.Models {
    public class Model {
        [BsonId]
        [BsonRepresentation(MongoDB.Bson.BsonType.ObjectId)]
        public string Id { get; set; }

        [BsonRequired]
        [BsonRepresentation(MongoDB.Bson.BsonType.ObjectId)]
        [JsonProperty("dataset_id")]
        [JsonPropertyName("dataset_id")]
        public string DatasetID { get; set; }

        [BsonRequired]
        [BsonRepresentation(MongoDB.Bson.BsonType.Int32)]
        public Status Status { get; set; }

        [BsonRequired]
        [JsonProperty("model_type")]
        [JsonPropertyName("model_type")]
        public string ModelType { get; set; } = "capsule_networks";

        [BsonRequired]
        [JsonProperty("class_names")]
        [JsonPropertyName("class_names")]
        public string[] ClassNames { get; set; } = null;

        [BsonRequired]
        [JsonProperty("class_colors")]
        [JsonPropertyName("class_colors")]
        public string[] ClassColors { get; set; } = null;

        [BsonRequired]
        [JsonProperty("class_assignments")]
        [JsonPropertyName("class_assignments")]
        public Shape[] ClassAssignments { get; set; } = null;

        [BsonRequired]
        [JsonProperty("use_groundtruth")]
        [JsonPropertyName("use_groundtruth")]
        public bool UseGroundTruth { get; set; } = false;

        [BsonRequired]
        public int Version { get; set; }

        [JsonProperty("sub_version")]
        [JsonPropertyName("sub_version")]
        public int SubVersion { get; set; }

        [JsonProperty("classification_performance")]
        [JsonPropertyName("classification_performance")]
        public object ClassificationPerformance { get; set; } = null;

        [JsonProperty("classification_map_data")]
        [JsonPropertyName("classification_map_data")]
        public string ClassificationMapData { get; set; } = null;

        [JsonProperty("confusion_map")]
        [JsonPropertyName("confusion_map_data")]
        public string ConfusionMap { get; set; } = null;

        [JsonProperty("classification_areas")]
        [JsonPropertyName("classification_areas")]
        public int[] ClassificationAreas { get; set; } = null;

        [JsonProperty("current_epoch")]
        [JsonPropertyName("current_epoch")]
        public int CurrentEpoch { get; set; } = -1;

        [JsonProperty("max_epoch")]
        [JsonPropertyName("max_epoch")]
        public int MaxEpoch { get; set; } = -1;

        [JsonProperty("parameters")]
        [JsonPropertyName("parameters")]
        public ModelParameter[] Parameters { get; set; } = null;

        [BsonRequired]
        public DateTime Queued { get; set; } = DateTime.Now;

        public DateTime? Started { get; set; } = null;

        public DateTime? Canceled { get; set; } = null;

        public DateTime? Finished { get; set; } = null;
    }

    public class ModelParameter {
        [JsonProperty("name")]
        [JsonPropertyName("name")]
        public string Name { get; set; }

        [JsonProperty("value")]
        [JsonPropertyName("value")]
        public string Value { get; set; }
    }
}
