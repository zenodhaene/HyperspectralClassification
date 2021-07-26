using database.Models;
using database.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace backend.Controllers {
    [Route("api/[controller]")]
    [ApiController]
    public class AccountsController : ControllerBase {

        private readonly AccountService _accountService;

        public AccountsController(AccountService accountService) {
            _accountService = accountService;
        }

        [HttpGet]
        [Route("")]
        public List<Account> GetAllAccounts() {
            return _accountService.GetAll();
        }

        [HttpGet]
        [Route("{id:length(24)}")]
        public ActionResult<Account> GetAccount(string id) {
            Account account = _accountService.Get(id);

            if (account == null) return NotFound();

            return account;
        }

        [HttpPost]
        [Route("")]
        public ActionResult<Account> Create(Account account) {
            _accountService.Create(account);
            return CreatedAtRoute(new { id = account.Id.ToString() }, account);
        }

        [HttpPut]
        [Route("{id:length(24)}")]
        public ActionResult<Account> Update(string id, Account account) {
            Account a = _accountService.Get(id);

            if (a == null) return NotFound();

            _accountService.Update(id, account);

            return account;
        }

        [HttpDelete]
        [Route("{id:length(24)}")]
        public ActionResult Delete(string id) {
            Account a = _accountService.Get(id);

            if (a == null) return NotFound();

            _accountService.Remove(id);

            return NoContent();
        }
    }
}
