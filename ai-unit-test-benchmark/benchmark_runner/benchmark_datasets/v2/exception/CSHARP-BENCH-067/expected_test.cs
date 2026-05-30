public class UserServiceTests
{
    [Fact]
    public void GetUserName_ShouldThrowArgumentNullException_WhenNameIsNull()
    {
        var service = new UserService();

        Assert.Throws<ArgumentNullException>(
            () => service.GetUserName(null));
    }
}