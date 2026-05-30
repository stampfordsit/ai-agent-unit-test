[Fact]
public void Subtract_ShouldReturnCorrectResult()
{
    var result = service.Subtract(10, 4);

    Assert.Equal(6, result);
}