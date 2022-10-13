/* window.vala -- This file is part of VStation.
   Copyright (C) 2022 XNSC

   VStation is free software: you can redistribute it and/or modify
   it under the terms of the GNU Affero General Public License as
   published by the Free Software Foundation, either version 3 of the
   License, or (at your option) any later version.

   VStation is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
   GNU Affero General Public License for more details.

   You should have received a copy of the GNU Affero General Public License
   along with VStation. If not, see <https://www.gnu.org/licenses/>. */

using Gtk;

[GtkTemplate (ui = "/org/xnsc/vstation/window.ui")]
public class VS.Window : ApplicationWindow {
	[GtkChild]
	private unowned Label fxf_dir_label;

	[GtkChild]
	private unowned Button select_button;

	[GtkChild]
	private unowned Label confirm_label;

	private string fxf_dir;

	public Window (Gtk.Application app) {
		Object (application: app);
		read_fstab ();
	}

	[GtkCallback]
	private void select_file (Button button) {
		var dialog = new FileChooserDialog ("Select File", this,
											FileChooserAction.OPEN,
											"Cancel", ResponseType.CANCEL,
											"Select", ResponseType.ACCEPT);
		dialog.show ();
		dialog.response.connect (on_select_file);
	}

	private int64 dir_size (File dir) throws Error {
	    var enumerator =
			dir.enumerate_children ("standard::*",
									FileQueryInfoFlags.NOFOLLOW_SYMLINKS);
		FileInfo info = null;
		int64 size = 0;
		while ((info = enumerator.next_file ()) != null) {
			if (info.get_file_type () == FileType.DIRECTORY) {
				File subdir = dir.resolve_relative_path (info.get_name ());
				size += dir_size (subdir);
			} else {
				size += info.get_size ();
			}
		}
		return size;
	}

	private void on_select_file (Dialog source, int response_id) {
		if (response_id == ResponseType.ACCEPT) {
			var chooser = source as FileChooser;
			var file = chooser.get_file ();
			var fxf_file = File.new_for_path (fxf_dir);
			try {
				var info = file.query_info ("standard::size",
											FileQueryInfoFlags.NONE);
				var size = info.get_size ();
				var fxf_size = dir_size (fxf_file);
				if (size + fxf_size >= 0x40000000) {
					confirm_label.set_text (
						"Max size of file transfer directory exceeded");
					return;
				}
			} catch (Error e) {
				confirm_label.set_text ("Unknown error occurred");
			}

			var count = 0;
			var suffix = "";
			while (true) {
			    var dest = fxf_file.get_child (file.get_basename () + suffix);
				try {
					file.copy (dest, FileCopyFlags.TARGET_DEFAULT_PERMS,
							   null, upload_progress);
					confirm_label.set_text ("Successfully uploaded as ");
					break;
				} catch (IOError.EXISTS e) {
					count++;
					suffix = "." + count.to_string ();
				} catch (Error e) {
					confirm_label.set_text ("Upload failed");
					break;
				}
			}
		}
		source.destroy ();
	}

	private void read_fstab () {
		try {
			var file = File.new_for_path ("/etc/fstab");
			var @is = file.read ();
			var dis = new DataInputStream (@is);
			string line;
			while ((line = dis.read_line ()) != null) {
				if (line.has_prefix ("/vstation_fxf")) {
					string[] lines = line.split_set (" \t", -1);
					for (var i = 1; i < lines.length; i++) {
						if (lines[i].has_prefix ("/")) {
							fxf_dir = lines[i];
							fxf_dir_label.set_text ("File transfer directory: "
													+ fxf_dir);
							select_button.sensitive = true;
							break;
						}
					}
				}
			}
		} catch (Error e) {}
	}

	private void upload_progress (int64 current, int64 total) {
		var current_format = format_size (current, FormatSizeFlags.IEC_UNITS);
		var total_format = format_size (total, FormatSizeFlags.IEC_UNITS);
		confirm_label.set_text ("Uploading " + current_format + "/" +
								total_format);
	}
}