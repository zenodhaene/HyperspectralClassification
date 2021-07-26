using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Collections.Generic;
using System.Text;

namespace database.Models {
    public class Account {
        [BsonId]
        [BsonRepresentation(MongoDB.Bson.BsonType.ObjectId)]
        public string Id { get; set; }

        [BsonRequired]
        public string Firstname { get; set; }

        [BsonRequired]
        public string Lastname { get; set; }

        [BsonRequired]
        public string Email { get; set; }
    }
}
