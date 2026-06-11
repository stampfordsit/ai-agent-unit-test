using BenchmarkSourceProject;
using Xunit;

namespace BenchmarkTestProject.Tests
{
    public class TestClassName
    {
        private readonly PasswordValidator _validator;

        public TestClassName()
        {
            _validator = new PasswordValidator();
        }

        [Fact]
        public void ValidatePassword_NullInput_ThrowsException()
        {
            Assert.Throws<NullReferenceException>(() => _validator.ValidatePassword(null));
        }

        [Theory]
        [InlineData("12345678", true)]
        [InlineData("123456789", true)]
        [InlineData("1234567", false)]
        [InlineData("", false)]
        [InlineData("        ", true)]
        [InlineData("a\nb\tc\rdefgh", true)]
        [InlineData("!@#$%^&*", true)]
        public void ValidatePassword_VariousInputs_ReturnsExpected(string password, bool expected)
        {
            var result = _validator.ValidatePassword(password);
            Assert.Equal(expected, result);
        }

        [Fact]
        public void ValidatePassword_VeryLongPassword_ReturnsTrue()
        {
            var longPassword = new string('a', 10000);
            var result = _validator.ValidatePassword(longPassword);
            Assert.True(result);
        }
    }
}