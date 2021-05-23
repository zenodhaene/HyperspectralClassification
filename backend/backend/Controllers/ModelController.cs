using backend.Services;
using database.Models;
using database.Services;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using System;
using System.Text.Json.Serialization;

namespace backend.Controllers {
    [Route("api/[controller]")]
    [ApiController]
    public class ModelController : ControllerBase {
        private readonly ModelService _modelService;
        private readonly PythonModelService _pythonModelService;

        public ModelController(ModelService modelService, PythonModelService pythonModelService) {
            _modelService = modelService;
            _pythonModelService = pythonModelService;
        }

        [HttpGet]
        [Route("")]
        public IActionResult GetAllModels() {
            return Ok(_modelService.GetAll());
        }

        [HttpGet]
        [Route("queued")]
        public IActionResult GetQueuedModels([FromQuery] int how_many) {
            if (how_many == 0) how_many = int.MaxValue;
            return Ok(_modelService.GetQueuedModels(how_many));
        }

        [HttpGet]
        [Route("finished")]
        public IActionResult GetFinishedModels([FromQuery] int how_many) {
            if (how_many == 0) how_many = int.MaxValue;
            return Ok(_modelService.GetRecentFinishedModels(how_many));
        }

        [HttpGet]
        [Route("filter-values")]
        public IActionResult GetFilterValues() {
            return Ok(_modelService.GetFilterParameters());
        }

        [HttpGet]
        [Route("filtered")]
        public IActionResult GetModelsFiltered(
            [FromQuery] int how_many = 20,
            [FromQuery] int page = 0,
            [FromQuery] string dataset = null,
            [FromQuery] string architecture = null,
            [FromQuery] string sort = null,
            [FromQuery] string version_search_string = null
        ) {
            return Ok(_modelService.GetFilteredModels(how_many, page, dataset, architecture, sort, version_search_string));
        }

        [HttpGet]
        [Route("types")]
        public IActionResult GetModelTypes() {
            return Ok(_pythonModelService.GetModelTypes().Result);
        }

        [HttpGet]
        [Route("{id:length(24)}")]
        public IActionResult GetModel(string id) {
            Model model = _modelService.Get(id);

            if (model == null) return NotFound();

            return Ok(model);
        }

        [HttpGet]
        [Route("parameters/{id:length(24)}")]
        public IActionResult GetParametersForModel(string id) {
            throw new NotImplementedException();
        }

        [HttpGet]
        [Route("parameters/type/{model_type}")]
        public IActionResult GetParametersForType(string model_type) {
            object test = _pythonModelService.GetParametersForType(model_type).Result;
            return Ok(test);
        }

        [HttpGet]
        [Route("server_information")]
        public IActionResult GetServerInformation() {
            return Ok(new ServerInformationModels {
                ModelsInQueue = _modelService.GetModelsInQueue()
            });
        }
    }

    public class ServerInformationModels {
        [JsonProperty("models_in_queue")]
        [JsonPropertyName("models_in_queue")]
        public long ModelsInQueue { get; set; }
    }
}
