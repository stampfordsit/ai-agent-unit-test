[Fact]
public void GetEvenNumbers_ShouldReturnOnlyEvenNumbers()
{
    var numbers = new List<int> { 1, 2, 3, 4, 5, 6 };

    var result = service.GetEvenNumbers(numbers);

    Assert.Equal(new List<int> { 2, 4, 6 }, result);
}