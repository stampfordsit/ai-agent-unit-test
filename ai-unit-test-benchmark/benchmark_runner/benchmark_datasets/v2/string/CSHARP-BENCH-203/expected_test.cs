[Fact]
public void Reverse_ShouldReturnReversedString()
{
    var result = service.Reverse("abcd");

    Assert.Equal("dcba", result);
}