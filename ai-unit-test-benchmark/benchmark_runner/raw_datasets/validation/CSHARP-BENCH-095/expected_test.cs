public class EmailValidatorTests
{
    [Fact]
    public void ValidateEmail_ShouldReturnTrue_WhenEmailValid()
    {
        var validator = new EmailValidator();

        var result = validator.ValidateEmail(
            "test@example.com");

        Assert.True(result);
    }

    [Fact]
    public void ValidateEmail_ShouldReturnFalse_WhenEmailInvalid()
    {
        var validator = new EmailValidator();

        var result = validator.ValidateEmail(
            "invalid-email");

        Assert.False(result);
    }
}