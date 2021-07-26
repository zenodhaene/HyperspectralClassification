using MongoDB.Bson.Serialization.Attributes;

namespace database.Models {
    public class MatlabDataset {

        [BsonId]
        [BsonRepresentation(MongoDB.Bson.BsonType.ObjectId)]
        public string Id { get; set; }

        [BsonRequired]
        [BsonRepresentation(MongoDB.Bson.BsonType.ObjectId)]
        public string Dataset { get; set; }

        [BsonRequired]
        public string KeyInDatafile { get; set; }

        [BsonRequired]
        public string GroundTruth { get; set; }
    }
}
