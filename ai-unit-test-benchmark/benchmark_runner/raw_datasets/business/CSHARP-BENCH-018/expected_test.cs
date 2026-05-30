[Theory]
[InlineData(10, false, "AVAILABLE")]
[InlineData(3, false, "LOW_STOCK")]
[InlineData(0, false, "OUT_OF_STOCK")]
[InlineData(10, true, "DISCONTINUED")]
public void ValidateStock_ShouldReturnCorrectStatus(
    int stock,
    bool discontinued,
    string expected)
{
    var result = service.ValidateStock(stock, discontinued);

    Assert.Equal(expected, result);
}