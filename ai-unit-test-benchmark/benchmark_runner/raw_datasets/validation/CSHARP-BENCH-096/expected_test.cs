public class PasswordValidatorTests
{
    [Fact]
    public void ValidatePassword_ShouldReturnTrue_WhenLengthValid()
    {
        var validator = new PasswordValidator();

        var result = validator.ValidatePassword(
            "Strong123");

        Assert.True(result);
    }

    [Fact]
    public void ValidatePassword_ShouldReturnFalse_WhenLengthTooShort()
    {
        var validator = new PasswordValidator();

        var result = validator.ValidatePassword(
            "1234");

        Assert.False(result);
    }
}