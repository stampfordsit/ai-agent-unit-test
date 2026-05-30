public class UserServiceTests
{
    [Fact]
    public void CreateUser_ShouldReturnFalse_WhenNameEmpty()
    {
        var service = new UserService();

        var result = service.CreateUser("");

        Assert.False(result);
    }
}