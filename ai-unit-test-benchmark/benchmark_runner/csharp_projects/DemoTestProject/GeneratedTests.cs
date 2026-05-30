using BenchmarkSourceProject;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using Xunit;

namespace BenchmarkTestProject.Tests
{
    public class SourceServiceTests
    {
        [Fact]
        public void GetAll_ReturnsOkResult_WithOrderedUserProfiles()
        {
            var service = new SourceService();

            var result = service.GetAll();

            var okResult = Assert.IsType<OkObjectResult>(result);
            var data = Assert.IsAssignableFrom<List<object>>(okResult.Value);
            for (int i = 1; i < data.Count; i++)
            {
                Assert.True(((dynamic)data[i - 1]).Id >= ((dynamic)data[i]).Id);
            }
        }
    }
}