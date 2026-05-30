[Theory]
[InlineData(18, true)]
[InlineData(20, true)]
[InlineData(17, false)]
public void IsAdult_ShouldValidateCorrectly(int age, bool expected)
{
    var result = service.IsAdult(age);

    Assert.Equal(expected, result);
}