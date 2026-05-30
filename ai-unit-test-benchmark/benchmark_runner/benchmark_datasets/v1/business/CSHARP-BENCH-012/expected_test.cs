[Fact]
public void CalculatePoints_ShouldReturnCorrectPoints()
{
    var result = service.CalculatePoints(550);

    Assert.Equal(5, result);
}