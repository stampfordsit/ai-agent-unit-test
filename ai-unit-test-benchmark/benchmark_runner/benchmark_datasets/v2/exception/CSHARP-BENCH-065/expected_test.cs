[Fact]
public void Divide_ByZero_ShouldThrowException()
{
    Assert.Throws<DivideByZeroException>(() =>
        service.Divide(10, 0));
}