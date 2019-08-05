require "sinatra"
require "sinatra/reloader" #if development?
require "sinatra/content_for"
require "tilt/erubis"
require "yaml"
require "redcarpet"
require "bcrypt"

configure do
  enable :sessions
  set :session_secret, 'secret'
  set :erb, :escape_html => true
end

helpers do
  def logged_in?
    session[:username]
  end

  def get_username
    session[:username]
  end

  def get_forum_posts
    forum_data.to_a.reverse.to_h
  end

  def get_recipes
    recipe_data.sort_by { |_, item| item[:title] }
  end

  def format_time(time)
    time.strftime("%b %-d, %Y   %l:%M %P")
  end

  def render_markdown(content)
    markdown = Redcarpet::Markdown.new(Redcarpet::Render::HTML)
    markdown.render(content)
  end
end

def recipe_data
  filepath = "./data/recipes.yaml"
  YAML.load(File.read(filepath))
end

def post_recipe(title, brew_method, content)
  data = recipe_data || {}
  username = session[:username].to_s
  time = Time.now
  message_id = data.keys.empty? ? 1 : data.keys.max + 1
  data[message_id] = {
    username: username,
    time: time,
    title: title,
    brew_method: brew_method,
    content: content.split("\r\n")
  }
  File.open("data/recipes.yaml", "w") { |file| file.write(data.to_yaml) }
end

def forum_data
  filepath = "./data/forum.yaml"
  YAML.load(File.read(filepath))
end

def post_in_forum(message)
  data = forum_data || {}
  username = session[:username].to_s
  time = Time.now
  message_id = data.keys.empty? ? 1 : data.keys.max + 1
  data[message_id] = {
    username: username,
    time: time,
    message: message
  }
  File.open("data/forum.yaml", "w") { |file| file.write(data.to_yaml) }
end

def users
  filepath = "./data/users.yaml"
  YAML.load(File.read(filepath))
end

def add_user(username, full_name, email, brew_method, password)
  data = users
  username = username.to_sym
  data[username] = {}
  data[username][:full_name] = full_name
  data[username][:email] = email
  data[username][:brew_method] = brew_method
  data[username][:password] = BCrypt::Password.create(password)
  File.open("data/users.yaml", "w") { |file| file.write(data.to_yaml) }
end

def update_user(username, full_name, email, brew_method, password)
  data = users
  username = username.to_sym
  data[username] != {}
  data[username][:full_name] = full_name
  data[username][:email] = email
  data[username][:brew_method] = brew_method
  data[username][:password] = BCrypt::Password.create(password) if not_blank?(password)
  File.open("data/users.yaml", "w") { |file| file.write(data.to_yaml) }
end

def delete_user(username)
  data = users
  username = username.to_sym
  data.delete(username)
  File.open("data/users.yaml", "w") { |file| file.write(data.to_yaml) }
end

def not_blank?(field)
  field != ""
end

def get_profile_data(username = session[:username])
  users[username.to_sym].select { |k, v| k != :password }
end

def valid_signin?(user, pass)
  user != "" &&
  pass != "" &&
  users.keys.map(&:to_s).any? { |name| name == user } &&
  users[user.to_sym][:password] == pass
end

def set_message(type, message)
  session[type] = message
end

def log_user_out
  session.delete(:username)
end

def sign_user_in(user)
  session[:username] = user
end

get "/" do
  erb :index, layout: :layout
end

get "/about" do
  erb :about, layout: :layout
end

get "/charts" do
  erb :charts, layout: :layout
end

get "/community" do
  erb :community, layout: :layout
end

get "/signin" do
  erb :signin, layout: :layout
end

get "/logout" do
  session.delete(:username)
  set_message :success, "You have been logged out."
  redirect "/"
end

post "/signin" do
  username = params[:username]
  password = params[:password]
  if valid_signin?(username, password)
    sign_user_in(username)
    set_message :success, "Welcome, #{username}!"
    redirect "/"
  else
    log_user_out
    set_message :error, "Invalid credentials."
    @username = username
    erb :signin, layout: :layout
  end

end

get "/users/create" do
  erb :create_account, layout: :layout
end

post "/users/create" do
  username = params[:username].strip
  email = params[:email].strip
  brew_method = params[:brew]
  full_name = params[:name]
  password = params[:password]
  if username == ""
    set_message :error, "Username cannot be blank."
    redirect "/users/create"
  elsif users.keys.map(&:to_s).none? { |user| user == username }
    add_user(username, full_name, email, brew_method, password)
    set_message :success, "Account created. Please sign in."
    redirect "/"
  else
    set_message :error, "Username is already taken."
    redirect "/users/create"
  end
end

get "/profile/:username" do |username|
  data = get_profile_data(username)
  @username = username
  @full_name = data[:full_name]
  @email = data[:email]
  @brew_method = data[:brew_method]
  erb :profile, layout: :layout
end

get "/community/general" do
  erb :general, layout: :layout
end

post "/community/post" do
  message = params[:message]
  if !logged_in?
    set_message :error, "You must be logged in to do that."
  elsif message == ""
    set_message :error, "Please include content to post."
  else
    post_in_forum(message)
    set_message :success, "Your message has been posted."
  end
  redirect "/community"
end

get "/community/recipes" do
  erb :recipes, layout: :layout
end

get "/community/recipes/add" do
  erb :add_recipe, layout: :layout
end

post "/community/recipes/add" do
  title = params[:title]
  brew_method = params[:brew_method]
  content = params[:content]
  post_recipe(title, brew_method, content)
  redirect "/community/recipes"
end

get "/community/recipes/:id" do |id|
  @recipe = recipe_data[id.to_i]
  erb :recipe, layout: :layout
end

# get "/community/members" do
#   erb :members, layout: :layout
# end

get "/community/post" do
  erb :forum_post, layout: :layout
end

get "/profile/:username/edit" do |username|
  if session[:username].to_s == username
    data = get_profile_data(username)
    @username = username
    @full_name = data[:full_name]
    @email = data[:email]
    @brew_method = data[:brew_method]
  else
    set_message :error, "You are not logged into this profile."
    redirect "/"
  end
  erb :edit_profile, layout: :layout
end

post "/profile/:username/edit" do |username|
  @username = username.strip
  @email = params[:email].strip
  @brew_method = params[:brew]
  @full_name = params[:name]
  @password = params[:password]
  if @username == ""
    set_message :error, "Username cannot be blank."
    erb :edit_profile, layout: :layout
  elsif users.keys.map(&:to_s).none? { |user| user == @username } ||
                               @username == session[:username].to_s
    update_user(@username, @full_name, @email, @brew_method, @password)
    set_message :success, "Profile updated."
    redirect "/profile/#{@username}"
  else
    set_message :error, "Username is already taken."
    erb :edit_profile, layout: :layout
  end
end

post "/profile/:username/delete" do |username|
  if username == session[:username].to_s
    delete_user(username)
    session.delete(:username)
    set_message :success, "Your profile has been deleted."
    redirect "/"
  else
    set_message :error, "You are not logged into this profile."
    redirect "/"
  end
end