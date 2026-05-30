[Theory]
[InlineData(100, 2, true, true)]
[InlineData(0, 2, true, false)]
[InlineData(100, 0, true, false)]
[InlineData(100, 2, false, false)]
public void ValidateOrder_ShouldValidateCorrectly(
    decimal total,
    int itemCount,
    bool isActive,
    bool expected)
{
    var result = service.ValidateOrder(total, itemCount, isActive);

    Assert.Equal(expected, result);
}