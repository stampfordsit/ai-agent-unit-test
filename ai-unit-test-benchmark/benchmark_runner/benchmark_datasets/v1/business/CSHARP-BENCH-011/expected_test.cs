[Fact]
public void CalculateTax_ShouldReturnCorrectTax()
{
    var result = service.CalculateTax(1000);

    Assert.Equal(70, result);
}