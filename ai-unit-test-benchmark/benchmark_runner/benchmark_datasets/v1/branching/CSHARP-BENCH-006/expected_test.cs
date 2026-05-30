[Theory]
[InlineData(500, 500)]
[InlineData(2000, 1800)]
public void CalculateDiscount_ShouldApplyCorrectly(decimal input, decimal expected)
{
    var result = service.CalculateDiscount(input);

    Assert.Equal(expected, result);
}