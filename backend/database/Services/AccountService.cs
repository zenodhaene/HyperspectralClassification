using database.Models;
using database.Settings;
using MongoDB.Driver;
using System;
using System.Collections.Generic;
using System.Text;

namespace database.Services {
    public class AccountService {
        private readonly IMongoCollection<Account> _accounts;

        public AccountService(IMongoDBSettings settings) {
            MongoClient client = new MongoClient(settings.ConnectionString);
            IMongoDatabase db = client.GetDatabase(settings.DatabaseName);

            _accounts = db.GetCollection<Account>(settings.AccountstoreDb.CollectionName);
        }

        public List<Account> GetAll() {
            return _accounts.Find(a => true).ToList();
        }

        public Account Get(string id) {
            return _accounts.Find(a => a.Id == id).FirstOrDefault();
        }

        // Generic methods

        public Account Create(Account account) {
            _accounts.InsertOne(account);
            return account;
        }

        public Account Update(string id, Account account) {
            account.Id = id;
            _accounts.ReplaceOne(a => a.Id == id, account);

            return account;
        }

        public void Remove(Account account) {
            _accounts.DeleteOne(a => a.Id == account.Id);
        }

        public void Remove(string id) {
            _accounts.DeleteOne(a => a.Id == id);
        }
    }
}
