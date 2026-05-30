[Fact]
public void GetUpperName_Null_ShouldThrowException()
{
    Assert.Throws<ArgumentNullException>(() =>
        service.GetUpperName(null));
}