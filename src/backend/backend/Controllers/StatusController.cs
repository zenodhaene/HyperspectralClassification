using database;
using database.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson;
using MongoDB.Driver.GridFS;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace backend.Controllers {
    [Route("api/[controller]")]
    [ApiController]
    public class StatusController : ControllerBase {

        private readonly DatasetService _datasetService;

        public StatusController(DatasetService datasetService) {
            _datasetService = datasetService;
        }

        [HttpGet]
        [Route("ping")]
        public IActionResult Ping() {
            return Ok("pong");
        }

        [HttpGet]
        [Route("jobs")]
        public IActionResult JobsInQueue() {
            return Ok(new JobDTO(5, 3604));
        }

        /*[HttpGet]
        [Route("testUpload")]
        public IActionResult Upload() {
            string test = "This is a test";

            GridFSFileInfo info = _datasetService.Upload(Encoding.UTF8.GetBytes(test), new database.Models.DatasetMetadata {
                DatasetName = "Test dataset",
                DatafileName = "Test filename"
            });

            return Ok(new GridFSFileInfoObject(info));
        }

        [HttpGet]
        [Route("testDownload/{id}")]
        public IActionResult Download(string id) {
            byte[] result = _datasetService.Download(id);
            return Ok(Encoding.UTF8.GetString(result, 0, result.Length));
        }

        [HttpDelete]
        [Route("testDelete/{id}")]
        public IActionResult Delete(string id) {
            _datasetService.Remove(id);

            return Ok();
        }*/

        public class JobDTO {
            public int jobs_in_queue { get; set; }
            public int current_job_remaining_time { get; set; }

            public JobDTO(int jobs_in_queue, int current_job_remaining_time) {
                this.jobs_in_queue = jobs_in_queue;
                this.current_job_remaining_time = current_job_remaining_time;
            }
        }
    }
}
