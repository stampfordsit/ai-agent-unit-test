public class UserServiceTests
{
    [Fact]
    public void GetUserRole_ShouldReturnAdmin_WhenIsAdminTrue()
    {
        var service = new UserService();

        var result = service.GetUserRole(true);

        Assert.Equal("ADMIN", result);
    }

    [Fact]
    public void GetUserRole_ShouldReturnUser_WhenIsAdminFalse()
    {
        var service = new UserService();

        var result = service.GetUserRole(false);

        Assert.Equal("USER", result);
    }
}