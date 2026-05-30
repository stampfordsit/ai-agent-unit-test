using BenchmarkSourceProject;
using Xunit;

namespace BenchmarkTestProject.Tests
{
    public class PasswordValidatorTests
    {
        [Fact]
        public void ValidatePassword_ValidLength_ReturnsTrue()
        {
            var validator = new PasswordValidator();
            string password = "12345678";

            bool result = validator.ValidatePassword(password);

            Assert.True(result);
        }

        [Fact]
        public void ValidatePassword_TooShort_ReturnsFalse()
        {
            var validator = new PasswordValidator();
            string password = "1234567";

            bool result = validator.ValidatePassword(password);

            Assert.False(result);
        }

        [Fact]
        public void ValidatePassword_ExactLength_ReturnsTrue()
        {
            var validator = new PasswordValidator();
            string password = "abcdefgh";

            bool result = validator.ValidatePassword(password);

            Assert.True(result);
        }

        [Fact]
        public void ValidatePassword_LongPassword_ReturnsTrue()
        {
            var validator = new PasswordValidator();
            string password = "VeryLongPassword123!";

            bool result = validator.ValidatePassword(password);

            Assert.True(result);
        }

        [Fact]
        public void ValidatePassword_EmptyString_ReturnsFalse()
        {
            var validator = new PasswordValidator();
            string password = "";

            bool result = validator.ValidatePassword(password);

            Assert.False(result);
        }
    }
}