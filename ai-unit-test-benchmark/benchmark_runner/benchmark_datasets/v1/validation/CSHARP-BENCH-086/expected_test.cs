[Theory]
[InlineData("test@example.com", true)]
[InlineData("invalid-email", false)]
public void IsValidEmail_ShouldValidateCorrectly(string email, bool expected)
{
    var result = service.IsValidEmail(email);

    Assert.Equal(expected, result);
}