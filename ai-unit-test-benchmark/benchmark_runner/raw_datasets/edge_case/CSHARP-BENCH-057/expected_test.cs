public class AgeValidatorTests
{
    [Fact]
    public void ValidateAge_ShouldReturnFalse_WhenAgeNegative()
    {
        var validator = new AgeValidator();

        var result = validator.ValidateAge(-1);

        Assert.False(result);
    }
}