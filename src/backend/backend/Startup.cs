using backend.Services;
using backend.Settings;
using database.Services;
using database.Settings;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.HttpsPolicy;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace backend {
    public class Startup {
        public Startup(IConfiguration configuration) {
            Configuration = configuration;
        }

        public IConfiguration Configuration { get; }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services) {
            services.Configure<MongoDBSettings>(Configuration.GetSection("MongoDB"));
            services.Configure<PythonBackendSettings>(Configuration.GetSection("PythonBackend"));

            services.AddHttpClient<PythonModelService>();

            services.AddSingleton<IMongoDBSettings>(o => o.GetRequiredService<IOptions<MongoDBSettings>>().Value);
            services.AddSingleton<IPythonBackendSettings>(o => o.GetRequiredService<IOptions<PythonBackendSettings>>().Value);

            services.AddSingleton<AccountService>();
            services.AddSingleton<DatasetService>();
            services.AddSingleton<MatlabDatasetService>();
            services.AddSingleton<ModelService>();

            services.AddSingleton<PythonDatasetService>();

            services.AddControllers().AddNewtonsoftJson();
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env) {
            if (env.IsDevelopment()) {
                app.UseDeveloperExceptionPage();
            }

            app.UseRouting();

            app.UseAuthorization();

            app.UseCors(builder => builder.WithOrigins("http://localhost:3000").AllowAnyHeader().AllowAnyMethod().AllowCredentials());

            app.UseEndpoints(endpoints => {
                endpoints.MapControllers();
            });
        }
    }
}
