using BenchmarkSourceProject;
using System.Threading.Tasks;
using Xunit;

namespace BenchmarkTestProject.Tests
{
    public class DownloadServiceTests
    {
        [Fact]
        public async Task DownloadAsync_ReturnsOK()
        {
            var service = new DownloadService();
            var result = await service.DownloadAsync();
            Assert.Equal("OK", result);
        }
    }
}