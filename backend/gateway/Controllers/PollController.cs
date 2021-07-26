using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace gateway.Controllers {
    [Route("")]
    [ApiController]
    public class PollController : ControllerBase {
        [HttpGet]
        [Route("monitoring/poll.axd")]
        public IActionResult Poll() {
            return Ok("OK");
        }
    }
}
