[Theory]
[InlineData(5000, false)]
[InlineData(10000, true)]
public void IsPremium_ShouldValidateCorrectly(decimal amount, bool expected)
{
    var result = service.IsPremium(amount);

    Assert.Equal(expected, result);
}