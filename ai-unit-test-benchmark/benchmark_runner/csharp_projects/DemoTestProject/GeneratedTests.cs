using BenchmarkSourceProject;
using Xunit;

namespace BenchmarkTestProject.Tests
{
    public class SourceServiceTests
    {
        [Fact]
        public void Divide_ValidInput_ReturnsCorrectQuotient()
        {
            var service = new SourceService();
            int result = service.Divide(10, 2);
            Assert.Equal(5, result);
        }

        [Fact]
        public void Divide_DenominatorZero_ThrowsDivideByZeroException()
        {
            var service = new SourceService();
            Assert.Throws<System.DivideByZeroException>(() => service.Divide(10, 0));
        }
    }
}