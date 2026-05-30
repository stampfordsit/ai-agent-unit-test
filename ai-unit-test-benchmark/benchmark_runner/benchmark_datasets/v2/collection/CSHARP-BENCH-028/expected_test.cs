[Fact]
public void FindMax_ShouldReturnLargestValue()
{
    var result = service.FindMax(new List<int> { 1, 5, 3 });

    Assert.Equal(5, result);
}