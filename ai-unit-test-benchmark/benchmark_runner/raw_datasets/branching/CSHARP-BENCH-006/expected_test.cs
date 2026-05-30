[Theory]
[InlineData(100, 50)]
[InlineData(500, 0)]
public void CalculateShipping_ShouldReturnCorrectFee(decimal total, decimal expected)
{
    var result = service.CalculateShipping(total);

    Assert.Equal(expected, result);
}