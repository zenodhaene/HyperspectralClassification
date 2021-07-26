using backend.Dto;
using backend.Services;
using database;
using database.Enums;
using database.Models;
using database.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using System.IO;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace backend.Controllers {
    [Route("api/[controller]")]
    [ApiController]
    public class DatasetController : ControllerBase {

        private readonly DatasetService _datasetService;
        private readonly PythonDatasetService _pythonDatasetService;
        private readonly ModelService _modelService;

        public DatasetController(DatasetService datasetService, PythonDatasetService pythonDatasetService, ModelService modelService) {
            _datasetService = datasetService;
            _pythonDatasetService = pythonDatasetService;
            _modelService = modelService;
        }

        [HttpGet]
        [Route("")]
        public IActionResult GetAllDatasets() {
            return Ok(_datasetService.GetAll());
        }

        [HttpPost]
        [Route("")]
        public IActionResult CreateDataset(DatasetDTO dto) {
            Dataset dataset = new Dataset {
                File = null,
                Name = dto.DatasetName,
            };

            _datasetService.Create(dataset);

            return CreatedAtRoute(new { id = dataset.Id.ToString() }, dataset);
        }

        [HttpGet]
        [Route("{id:length(24)}")]
        public IActionResult GetDataset(string id) {
            Dataset dataset = _datasetService.Get(id);

            if (dataset == null) return NotFound();

            return Ok(dataset);
        }

        [HttpPost]
        [RequestSizeLimit(524288000)]
        [RequestFormLimits(ValueLengthLimit = int.MaxValue, MultipartBodyLengthLimit = int.MaxValue)]
        [Route("{id:length(24)}")]
        public IActionResult Upload(string id, IFormFile file, [FromQuery] DatafileType type) {
            Dataset dataset = _datasetService.Get(id);

            if (dataset == null) return NotFound();

            try {
                Stream stream = file.OpenReadStream();
                string filename = file.FileName;
                var info = _datasetService.Upload(stream, filename);

                dataset.File = info.Id.ToString();
                dataset.DatafileType = type;

                _datasetService.Update(id, dataset);

                return Ok(dataset);
            } catch {
                return StatusCode(StatusCodes.Status500InternalServerError);
            }
        }

        [HttpPost]
        [Route("{id:length(24)}/edit")]
        public IActionResult Edit(string id, EditDTO editDto) {
            Dataset dataset = _datasetService.Get(id);
            if (dataset == null) return NotFound();

            if (editDto.Name != "") {
                dataset = _datasetService.Rename(id, editDto.Name);
            }

            if (editDto.Resolution != 0) {
                dataset = _datasetService.ChangeResolution(id, editDto.Resolution);
            }

            return Ok(dataset);
        }

        [HttpGet]
        [Route("{id:length(24)}/validate")]
        public async Task<IActionResult> Validate(string id) {
            Dataset dataset = _datasetService.Get(id);

            if (dataset == null) return NotFound("This dataset ID does not exist");

            if (dataset.File == null) return NotFound("The datafile for this dataset is not yet registered");

            object dto = await _pythonDatasetService.Validate(id);
            return Ok(dto);
        }

        [HttpGet]
        [Route("{id:length(24)}/confirm")]
        public IActionResult Confirm(string id) {
            Dataset dataset = _datasetService.Get(id);

            if (dataset == null) return NotFound("This dataset ID does not exist");

            if (dataset.File == null) return BadRequest("This dataset has no associated datafile and can therefore not be validated");

            if (!dataset.Valid) return BadRequest("This dataset is not valid, please validate the datafile");

            dataset.Shown = true;
            _datasetService.Update(id, dataset);

            return Ok();
        }

        [HttpGet]
        [Route("{id:length(24)}/layer/{layer:int}")]
        public async Task<IActionResult> GetLayer(string id, int layer) {
            Dataset dataset = _datasetService.Get(id);

            if (dataset == null) return NotFound("This dataset ID does not exist");

            if (dataset.File == null) return BadRequest("This dataset has no associated datafile and data can therefore not be extracted");

            if (!dataset.Valid) return BadRequest("This dataset is not valid, please validate the datafile");

            string layerData = await _pythonDatasetService.GetLayer(id, layer);
            return Ok(layerData);
        }

        [HttpPost]
        [Route("{id:length(24)}/generate_thumbnail")]
        public async Task<IActionResult> GenerateThumbnail(string id, GenerateThumbnailDto dto) {
            Dataset dataset = _datasetService.Get(id);

            if (dataset == null) return NotFound("This dataset ID does not exist");

            if (dataset.File == null) return BadRequest("This dataset has no associated datafile and data can therefore not be extracted");

            if (!dataset.Valid) return BadRequest("This dataset is not valid, please validate the datafile");

            if (dataset.Thumbnail != null) return Ok(dataset);

            string response = await _pythonDatasetService.GenerateThumbnail(id, dto.Layer);
            dataset.Thumbnail = response;
            _datasetService.Update(id, dataset);

            return Ok(dataset);
        }

        [HttpGet]
        [Route("{id:length(24)}/ground_truth_image")]
        public async Task<IActionResult> GenerateGroundTruthImage(string id) {
            Dataset dataset = _datasetService.Get(id);

            if (dataset == null) return NotFound("This dataset ID does not exist");
            if (!dataset.Valid) return BadRequest("This dataset is not valid, please validate the dataset");
            if (dataset.GroundTruth == null) return BadRequest("No groundtruth associated with this dataset");

            string response = await _pythonDatasetService.GenerateGroundTruthImage(id);
            return Ok(response);
        }

        [HttpPost]
        [Route("{id:length(24)}/model")]
        public IActionResult CreateModel(string id, ModelDTO dto) {
            if (dto.Version == -1) {
                dto.Version = _modelService.GetAvailableModelVersion();
            }

            Model model = new Model {
                DatasetID = id,
                Status = Status.QUEUED,
                ClassNames = dto.ClassNames,
                ClassAssignments = dto.ClassAssignments,
                ClassColors = dto.ClassColors,
                Parameters = dto.Parameters,
                Version = dto.Version,
                ModelType = dto.ModelType,
                SubVersion = _modelService.GetAvailableModelSubVersion(dto.Version)
            };

            _modelService.Create(model);

            return CreatedAtRoute(new { id = model.Id.ToString() }, model);
        }

        [HttpPost]
        [Route("{id:length(24)}/model_groundtruth")]
        public IActionResult CreateModelWithGroundtruth(string id, ModelGTDTO dto) {
            if (dto.Version == -1) {
                dto.Version = _modelService.GetAvailableModelVersion();
            }

            Model model = new Model {
                DatasetID = id,
                Status = Status.QUEUED,
                Parameters = dto.Parameters,
                Version = dto.Version,
                ModelType = dto.ModelType,
                SubVersion = _modelService.GetAvailableModelSubVersion(dto.Version),
                UseGroundTruth = true
            };

            _modelService.Create(model);

            return CreatedAtRoute(new { id = model.Id.ToString() }, model);
        }

        [HttpPost]
        [RequestSizeLimit(524288000)]
        [Route("{id:length(24)}/groundtruth")]
        public IActionResult UploadGroundTruth(string id, IFormFile file, [FromQuery] DatafileType type) {
            Dataset dataset = _datasetService.Get(id);

            if (dataset == null) return NotFound();
            if (dataset.DatafileType != type) {
                return BadRequest("Extension of datafile and groundtruth differs. This is not supported for now");
            }

            try {
                Stream stream = file.OpenReadStream();
                string filename = file.FileName;
                var info = _datasetService.Upload(stream, filename);

                dataset.GroundTruth = info.Id.ToString();

                _datasetService.Update(id, dataset);

                return Ok(dataset);
            } catch {
                return StatusCode(StatusCodes.Status500InternalServerError);
            }
        }

        [HttpGet]
        [Route("{id:length(24)}/groundtruth_validate")]
        public async Task<IActionResult> ValidateGroundTruth(string id) {
            Dataset dataset = _datasetService.Get(id);

            if (dataset == null) return NotFound("This dataset ID does not exist");
            if (dataset.File == null) return NotFound("The datafile for this dataset is not yet registered");
            if (dataset.GroundTruth == null) return NotFound("The ground truth file for this dataset is not yet registered");

            object dto = await _pythonDatasetService.ValidateGroundTruth(id);
            return Ok(dto);
        }

        public class DatasetDTO {
            public string DatasetName { get; set; }
        }
        
        public class EditDTO {
            public string Name { get; set; }

            public double Resolution { get; set; }
        }

        // https://github.com/dotnet/runtime/issues/29414
        public class ModelDTO {
            [JsonProperty("class_names")]
            [JsonPropertyName("class_names")]
            public string[] ClassNames { get; set; }

            [JsonProperty("class_colors")]
            [JsonPropertyName("class_colors")]
            public string[] ClassColors { get; set; }

            [JsonProperty("class_assignments")]
            [JsonPropertyName("class_assignments")]
            public Shape[] ClassAssignments { get; set; }

            [JsonProperty("model_type")]
            [JsonPropertyName("model_type")]
            public string ModelType { get; set; }

            [JsonProperty("parameters")]
            [JsonPropertyName("parameters")]
            public ModelParameter[] Parameters { get; set; }

            [JsonProperty("version")]
            [JsonPropertyName("version")]
            public int Version { get; set; }
        }

        public class ModelGTDTO {

            [JsonProperty("model_type")]
            [JsonPropertyName("model_type")]
            public string ModelType { get; set; }

            [JsonProperty("parameters")]
            [JsonPropertyName("parameters")]
            public ModelParameter[] Parameters { get; set; }

            [JsonProperty("version")]
            [JsonPropertyName("version")]
            public int Version { get; set; }
        }

        public class GenerateThumbnailDto {
            public int Layer { get; set; }
        }
    }
}
