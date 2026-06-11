using BenchmarkSourceProject;
using Xunit;

namespace BenchmarkTestProject.Tests
{
    public class PasswordValidatorTests
    {
        private readonly PasswordValidator _passwordValidator;

        public PasswordValidatorTests()
        {
            _passwordValidator = new PasswordValidator();
        }

        [Fact]
        public void ValidatePassword_ValidPassword_ReturnsTrue()
        {
            var password = "password123";
            var result = _passwordValidator.ValidatePassword(password);
            Assert.True(result);
        }

        [Fact]
        public void ValidatePassword_InvalidPassword_ReturnsFalse()
        {
            var password = "pass";
            var result = _passwordValidator.ValidatePassword(password);
            Assert.False(result);
        }

        [Fact]
        public void ValidatePassword_NullInput_ReturnsFalse()
        {
            string? password = null;
            var result = _passwordValidator.ValidatePassword(password ?? string.Empty);
            Assert.False(result);
        }

        [Fact]
        public void ValidatePassword_EmptyInput_ReturnsFalse()
        {
            var password = "";
            var result = _passwordValidator.ValidatePassword(password);
            Assert.False(result);
        }

        [Fact]
        public void ValidatePassword_SingleCharacterInput_ReturnsFalse()
        {
            var password = "a";
            var result = _passwordValidator.ValidatePassword(password);
            Assert.False(result);
        }

        [Fact]
        public void ValidatePassword_ShortPasswordInput_ReturnsFalse()
        {
            var password = "short";
            var result = _passwordValidator.ValidatePassword(password);
            Assert.False(result);
        }

        [Fact]
        public void ValidatePassword_LongPasswordInput_ReturnsTrue()
        {
            var password = "longpassword123";
            var result = _passwordValidator.ValidatePassword(password);
            Assert.True(result);
        }

        [Theory]
        [InlineData("password123", true)]
        [InlineData("pass", false)]
        [InlineData("", false)]
        [InlineData(null, false)]
        [InlineData("a", false)]
        [InlineData("short", false)]
        [InlineData("longpassword123", true)]
        public void ValidatePassword_VariousInputs_ReturnsExpectedResults(string? password, bool expectedResult)
        {
            var result = _passwordValidator.ValidatePassword(password ?? string.Empty);
            Assert.Equal(expectedResult, result);
        }
    }
}