using database.Enums;
using MongoDB.Bson.Serialization.Attributes;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Text;
using System.Text.Json.Serialization;

namespace database.Models.Derived {
    public class ModelLimited {

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

        [JsonProperty("classification_performance")]
        [JsonPropertyName("classification_performance")]
        public object ClassificationPerformance { get; set; } = null;

        [JsonProperty("current_epoch")]
        [JsonPropertyName("current_epoch")]
        public int CurrentEpoch { get; set; } = -1;

        [JsonProperty("max_epoch")]
        [JsonPropertyName("max_epoch")]
        public int MaxEpoch { get; set; } = -1;

        public int Version { get; set; }

        [JsonProperty("sub_version")]
        [JsonPropertyName("sub_version")]
        public int SubVersion { get; set; }

        public string Thumbnail { get; set; }

        [BsonRequired]
        public DateTime Queued { get; set; } = DateTime.Now;

        public DateTime? Started { get; set; } = null;

        public DateTime? Canceled { get; set; } = null;

        public DateTime? Finished { get; set; } = null;

        // Non-standard fields
        [JsonProperty("dataset_name")]
        [JsonPropertyName("dataset_name")]
        public string DatasetName { get; set; } = null;

        [JsonProperty("position_in_queue")]
        [JsonPropertyName("position_in_queue")]
        public int PositionInQueue { get; set; } = -1;

        public ModelLimited(Model model) {
            Id = model.Id;
            DatasetID = model.DatasetID;
            Status = model.Status;
            CurrentEpoch = model.CurrentEpoch;
            MaxEpoch = model.MaxEpoch;
            Queued = model.Queued;
            Started = model.Started;
            Canceled = model.Canceled;
            Finished = model.Finished;
            Version = model.Version;
            SubVersion = model.SubVersion;
            ClassificationPerformance = model.ClassificationPerformance;
            Thumbnail = model.ClassificationMapData;
        }
    }
}
