public class AgeValidatorTests
{
    [Fact]
    public void ValidateAge_ShouldReturnTrue_WhenAgeInRange()
    {
        var validator = new AgeValidator();

        var result = validator.ValidateAge(25);

        Assert.True(result);
    }

    [Fact]
    public void ValidateAge_ShouldReturnFalse_WhenAgeBelowRange()
    {
        var validator = new AgeValidator();

        var result = validator.ValidateAge(15);

        Assert.False(result);
    }

    [Fact]
    public void ValidateAge_ShouldReturnFalse_WhenAgeAboveRange()
    {
        var validator = new AgeValidator();

        var result = validator.ValidateAge(70);

        Assert.False(result);
    }
}